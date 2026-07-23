use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;
use zip::ZipArchive;

#[derive(serde::Serialize)]
pub struct DeviceInfo {
    hostname: String,
    fingerprint: String,
}

#[derive(serde::Serialize)]
pub struct InstallInfo {
    installed: bool,
    version_id: Option<String>,
    install_path: Option<String>,
}

fn app_data_dir(app: &tauri::AppHandle) -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("KeyLaunch")
}

fn games_dir(app: &tauri::AppHandle) -> PathBuf {
    app_data_dir(app).join("games")
}

fn config_path(app: &tauri::AppHandle) -> PathBuf {
    app_data_dir(app).join("config.json")
}

#[tauri::command]
fn get_device_info() -> Result<DeviceInfo, String> {
    let hostname = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "UNKNOWN-PC".to_string());

    let raw = format!(
        "{}-{}-{}",
        hostname,
        std::env::consts::OS,
        std::env::consts::ARCH
    );
    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    let fingerprint = hex::encode(hasher.finalize());

    Ok(DeviceInfo {
        hostname,
        fingerprint,
    })
}

#[tauri::command]
fn get_saved_activations(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let path = config_path(&app);
    if !path.exists() {
        return Ok(vec![]);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let data: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(data["activation_ids"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default())
}

#[tauri::command]
fn save_activation(app: tauri::AppHandle, activation_id: String) -> Result<(), String> {
    let path = config_path(&app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let mut ids = get_saved_activations(app.clone())?;
    if !ids.contains(&activation_id) {
        ids.push(activation_id);
    }

    let data = serde_json::json!({ "activation_ids": ids });
    fs::write(&path, data.to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_install_info(app: tauri::AppHandle, project_id: String) -> Result<InstallInfo, String> {
    let install_dir = games_dir(&app).join(&project_id);
    let meta_path = install_dir.join(".keylaunch.json");

    if !meta_path.exists() {
        return Ok(InstallInfo {
            installed: false,
            version_id: None,
            install_path: None,
        });
    }

    let content = fs::read_to_string(&meta_path).map_err(|e| e.to_string())?;
    let meta: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    Ok(InstallInfo {
        installed: true,
        version_id: meta["version_id"].as_str().map(String::from),
        install_path: Some(install_dir.to_string_lossy().to_string()),
    })
}

#[tauri::command]
async fn download_and_install(
    app: tauri::AppHandle,
    project_id: String,
    version_id: String,
    download_url: String,
    expected_sha256: String,
) -> Result<String, String> {
    let games = games_dir(&app);
    fs::create_dir_all(&games).map_err(|e| e.to_string())?;

    let zip_path = games.join(format!("{}_{}_download.zip", project_id, version_id));

    // Download via reqwest (blocking in async command)
    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download HTTP error: {}", response.status()));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;

    // Verify SHA-256
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let hash = hex::encode(hasher.finalize());
    if hash.to_lowercase() != expected_sha256.to_lowercase() {
        return Err("SHA-256 mismatch — download corrupted or tampered".to_string());
    }

    fs::write(&zip_path, &bytes).map_err(|e| e.to_string())?;

    let install_dir = games.join(&project_id);
    if install_dir.exists() {
        fs::remove_dir_all(&install_dir).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&install_dir).map_err(|e| e.to_string())?;

    extract_zip(&zip_path, &install_dir)?;

    let meta = serde_json::json!({
        "version_id": version_id,
        "sha256": expected_sha256,
        "installed_at": chrono_now(),
    });
    fs::write(
        install_dir.join(".keylaunch.json"),
        meta.to_string(),
    )
    .map_err(|e| e.to_string())?;

    let _ = fs::remove_file(&zip_path);

    Ok(install_dir.to_string_lossy().to_string())
}

fn extract_zip(zip_path: &Path, dest: &Path) -> Result<(), String> {
    let file = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => dest.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                fs::create_dir_all(p).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn launch_executable(install_path: String, executable_path: String) -> Result<(), String> {
    let exe = PathBuf::from(&install_path).join(&executable_path);
    if !exe.exists() {
        return Err(format!("Executable not found: {}", exe.display()));
    }

    Command::new(&exe)
        .current_dir(exe.parent().unwrap_or(Path::new(&install_path)))
        .spawn()
        .map_err(|e| format!("Failed to launch: {}", e))?;

    Ok(())
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let dur = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    dur.as_secs().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .invoke_handler(tauri::generate_handler![
            get_device_info,
            get_saved_activations,
            save_activation,
            get_install_info,
            download_and_install,
            launch_executable,
        ])
        .setup(|app| {
            let data_dir = app_data_dir(app.handle());
            fs::create_dir_all(&data_dir).ok();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running KeyLaunch");
}

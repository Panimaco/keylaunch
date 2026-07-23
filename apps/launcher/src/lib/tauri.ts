import { invoke } from '@tauri-apps/api/core';

export interface DeviceInfo {
  hostname: string;
  fingerprint: string;
}

export interface InstallInfo {
  installed: boolean;
  version_id: string | null;
  install_path: string | null;
}

export function getDeviceInfo(): Promise<DeviceInfo> {
  return invoke('get_device_info');
}

export function getSavedActivations(): Promise<string[]> {
  return invoke('get_saved_activations');
}

export function saveActivation(activationId: string): Promise<void> {
  return invoke('save_activation', { activationId });
}

export function getInstallInfo(projectId: string): Promise<InstallInfo> {
  return invoke('get_install_info', { projectId });
}

export function downloadAndInstall(
  projectId: string,
  versionId: string,
  downloadUrl: string,
  expectedSha256: string,
): Promise<string> {
  return invoke('download_and_install', {
    projectId,
    versionId,
    downloadUrl,
    expectedSha256,
  });
}

export function launchExecutable(installPath: string, executablePath: string): Promise<void> {
  return invoke('launch_executable', { installPath, executablePath });
}

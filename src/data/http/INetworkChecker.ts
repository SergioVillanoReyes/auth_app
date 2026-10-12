export interface INetworkChecker {
  checkConnectivity(): Promise<void>
}

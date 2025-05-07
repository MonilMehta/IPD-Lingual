export async function getPermission(permission, requestPermission) {
  if (!permission) {
    const permissionResult = await requestPermission();
    if (!permissionResult.granted) {
      return false;
    }
    return true;
  }
  return true;
}

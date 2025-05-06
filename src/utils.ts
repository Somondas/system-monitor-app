export const formatBytes = (bytes: number) => {
  const gb = bytes / 1024 ** 3;
  return gb.toFixed(2);
};

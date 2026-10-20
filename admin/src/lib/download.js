// Saves a blob as a file, through a link the browser "clicks" itself.
export const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // The download reads the URL after this task, so it is released on the next one.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

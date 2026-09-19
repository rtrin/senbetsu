/** Resolves Chrome's semantic Bookmarks Bar root without relying on its numeric ID. */
export async function getBookmarksBarId(): Promise<string> {
  const tree = await chrome.bookmarks.getTree();
  const [root] = tree;

  if (!root) {
    throw new Error('Bookmarks tree is missing a root node.');
  }

  const bookmarksBars = (root.children ?? []).filter((node) => node.folderType === 'bookmarks-bar');

  if (bookmarksBars.length === 0) {
    throw new Error('Bookmarks Bar root folder is missing.');
  }
  if (bookmarksBars.length > 1) {
    throw new Error('Bookmarks tree has multiple Bookmarks Bar root folders.');
  }

  return bookmarksBars[0].id;
}

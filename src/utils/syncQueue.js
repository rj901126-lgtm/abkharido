// Keep updates to each saved list in click order, including after a failed request.
export function createSyncQueue() {
  const pending = new Map();
  return (key, task) => {
    const result = (pending.get(key) || Promise.resolve()).catch(() => {}).then(task);
    pending.set(key, result);
    const finished = () => { if (pending.get(key) === result) pending.delete(key); };
    result.then(finished, finished);
    return result;
  };
}

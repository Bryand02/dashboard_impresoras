import { queueItems } from "../data/mockData.js";

class QueueService {
  constructor() {
    this.queue = structuredClone(queueItems);
  }

  list() {
    return [...this.queue].sort((a, b) => a.priority - b.priority);
  }

  add(item) {
    this.queue.push(item);
    return item;
  }

  update(id, payload) {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.queue[index] = { ...this.queue[index], ...payload };
    return this.queue[index];
  }

  remove(id) {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.queue.splice(index, 1);
    return true;
  }
}

export const queueService = new QueueService();

// Domain Entity: Order
// Pure business logic, no framework dependencies

class Order {
  constructor({ id, customerId, status, items, createdAt, updatedAt, version }) {
    this.id = id;
    this.customerId = customerId;
    this.status = status || 'PENDING';
    this.items = items || [];
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.version = version || 0;
  }

  // Business logic methods
  confirm() {
    if (this.status !== 'PENDING') {
      throw new Error(`Cannot confirm order in status: ${this.status}`);
    }
    this.status = 'CONFIRMED';
    this.updatedAt = new Date();
    this.version += 1;
  }

  cancel() {
    if (this.status !== 'PENDING') {
      throw new Error(`Cannot cancel order in status: ${this.status}`);
    }
    this.status = 'CANCELLED';
    this.updatedAt = new Date();
    this.version += 1;
  }

  isPending() {
    return this.status === 'PENDING';
  }

  isConfirmed() {
    return this.status === 'CONFIRMED';
  }

  isCancelled() {
    return this.status === 'CANCELLED';
  }
}

module.exports = Order;

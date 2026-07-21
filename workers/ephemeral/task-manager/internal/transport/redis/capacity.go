package redis

// CapacityGate provides admission control for the transport: it answers
// "is there capacity to execute one more message right now?" and holds that
// capacity for the message once admitted.
//
// The transport attempts acquires a slot before reading a message off the transport and
// releases it when the message's handler finishes. This ensures every accepted
// message has execution capacity set aside for it.
type CapacityGate interface {
	// AcquireSlot attempts to reserve one unit of execution capacity,
	// returning the reservation id on success or "" when none is available.
	AcquireSlot() string
	// ReleaseSlot releases a reserved unit of execution capacity, returning it to the pool.
	// No-op if the id is empty.
	ReleaseSlot(id string)
	// ReleaseUnusedSlot releases one fungible unused reservation back to the pool.
	// Used when a handler exits before the pool can consume a reservation
	// No-op when none are outstanding.
	ReleaseUnusedSlot()
}

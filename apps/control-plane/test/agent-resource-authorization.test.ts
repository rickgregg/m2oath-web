import {
  describe,
  expect,
  it
} from 'vitest'

import {
  authorizeAgentResource
} from '../src/account/index.js'

import type {
  M2OathAgentRelationship
} from '../src/account/index.js'

const ownership: M2OathAgentRelationship = {
  userId: 'user-123',
  agentId: 'agent-123',
  relationship: 'owner',
  createdAt: new Date('2026-09-17T00:00:00Z')
}

describe('Agent resource authorization', () => {
  it('allows developer to request Agent creation without an existing relationship', () => {
    expect(
      authorizeAgentResource({
        role: 'developer',
        capability: 'agent.create'
      })
    ).toBe(true)
  })

  it('allows developer owner to rotate an Agent key', () => {
    expect(
      authorizeAgentResource({
        role: 'developer',
        capability: 'agent.rotate-key',
        relationship: ownership
      })
    ).toBe(true)
  })

  it('allows developer owner to disable an Agent', () => {
    expect(
      authorizeAgentResource({
        role: 'developer',
        capability: 'agent.disable',
        relationship: ownership
      })
    ).toBe(true)
  })

  it('denies developer key rotation without an Agent relationship', () => {
    expect(
      authorizeAgentResource({
        role: 'developer',
        capability: 'agent.rotate-key'
      })
    ).toBe(false)
  })

  it('denies developer disable without an Agent relationship', () => {
    expect(
      authorizeAgentResource({
        role: 'developer',
        capability: 'agent.disable'
      })
    ).toBe(false)
  })

  it('denies ordinary user Agent creation', () => {
    expect(
      authorizeAgentResource({
        role: 'user',
        capability: 'agent.create'
      })
    ).toBe(false)
  })

  it('denies ordinary user lifecycle operation even when an ownership relationship exists', () => {
    expect(
      authorizeAgentResource({
        role: 'user',
        capability: 'agent.disable',
        relationship: ownership
      })
    ).toBe(false)
  })

  it('does not implicitly grant admin Agent lifecycle authority', () => {
    expect(
      authorizeAgentResource({
        role: 'admin',
        capability: 'agent.disable',
        relationship: ownership
      })
    ).toBe(false)
  })
})

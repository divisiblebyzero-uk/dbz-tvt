import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Automatically clear the DOM tree structure after every test completes
afterEach(() => {
  cleanup()
})

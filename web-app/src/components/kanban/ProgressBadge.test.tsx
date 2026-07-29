import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressBadge from './ProgressBadge'

describe('ProgressBadge Component', () => {
  it('renders individual user progress states accurately', () => {
    render(<ProgressBadge userName="Wife" state="watching" season={1} />)
    
    expect(screen.getByText(/Wife:/i)).toBeInTheDocument()
    expect(screen.getByText(/watching/i)).toBeInTheDocument()
    expect(screen.getByText(/\(S1\)/i)).toBeInTheDocument() // Exact match for (S1)
  })

  it('omits season identifiers if a movie media item is supplied', () => {
    render(<ProgressBadge userName="Husband" state="prioritised" />)
    
    expect(screen.getByText(/prioritised/i)).toBeInTheDocument()
    // Explicitly verify the season bracket structure "(S" is not found anywhere
    expect(screen.queryByText(/\(S/i)).not.toBeInTheDocument()
  })
})

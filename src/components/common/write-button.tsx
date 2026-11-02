import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAccess } from '@/features/profile/api'

export const READ_ONLY_MESSAGE = 'Your free trial has ended. Subscribe to create and edit.'

/** A button that is disabled (with an explanation) when the account is read-only. */
export function WriteButton({ disabled, ...props }: ComponentProps<typeof Button>) {
  const { canWrite } = useAccess()
  if (canWrite) return <Button disabled={disabled} {...props} />
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span wrapper: disabled buttons don't fire pointer events */}
        <span tabIndex={0} className="inline-flex rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <Button {...props} disabled aria-disabled="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{READ_ONLY_MESSAGE}</TooltipContent>
    </Tooltip>
  )
}

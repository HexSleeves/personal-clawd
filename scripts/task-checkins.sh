#!/bin/bash
set -euo pipefail

/usr/bin/osascript <<'APPLESCRIPT'
set listNames to {"Work", "Personal", "Errands"}
set morningTitle to "Morning plan (Top 3)"
set afternoonTitle to "3pm check-in (progress + next)"

set nowDate to (current date)
set y to year of nowDate as integer
set m to month of nowDate
set d to day of nowDate as integer

set morningDue to (current date)
set year of morningDue to y
set month of morningDue to m
set day of morningDue to d
set time of morningDue to (9 * hours + 0 * minutes)

set afternoonDue to (current date)
set year of afternoonDue to y
set month of afternoonDue to m
set day of afternoonDue to d
set time of afternoonDue to (15 * hours + 0 * minutes)

tell application "Reminders"
	-- Ensure lists exist
	repeat with ln in listNames
		set listName to (ln as text)
		if not (exists list listName) then
			make new list with properties {name:listName}
		end if
	end repeat

	set workList to list "Work"

	-- Create today's morning check-in if missing
	set existingMorning to (reminders of workList whose name is morningTitle and due date is morningDue and completed is false)
	if (count of existingMorning) is 0 then
		make new reminder at end of reminders of workList with properties {name:morningTitle, due date:morningDue}
	end if

	-- Create today's 3pm check-in if missing
	set existingAfternoon to (reminders of workList whose name is afternoonTitle and due date is afternoonDue and completed is false)
	if (count of existingAfternoon) is 0 then
		make new reminder at end of reminders of workList with properties {name:afternoonTitle, due date:afternoonDue}
	end if
end tell
APPLESCRIPT

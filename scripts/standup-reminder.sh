#!/bin/bash
set -euo pipefail

LIST_NAME="Work"
TITLE="Standup"

/usr/bin/osascript <<'APPLESCRIPT'
on pad2(n)
	set s to (n as integer) as text
	if (count s) = 1 then return "0" & s
	return s
end pad2

set listName to system attribute "LIST_NAME"
set titleText to system attribute "TITLE"

set nowDate to (current date)
set y to year of nowDate as integer
set m to month of nowDate
set d to day of nowDate as integer

set dueDate to (current date)
set year of dueDate to y
set month of dueDate to m
set day of dueDate to d
set time of dueDate to (9 * hours + 20 * minutes)

tell application "Reminders"
	set targetList to missing value
	if (exists list listName) then
		set targetList to list listName
	else
		set targetList to make new list with properties {name:listName}
	end if

	set existingReminders to (reminders of targetList whose name is titleText and due date is dueDate and completed is false)
	if (count of existingReminders) is 0 then
		make new reminder at end of reminders of targetList with properties {name:titleText, due date:dueDate}
	end if
end tell
APPLESCRIPT

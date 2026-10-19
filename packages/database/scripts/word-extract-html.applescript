#!/usr/bin/osascript
-- Save .doc/.docx as HTML via Microsoft Word (keeps inline images), unattended.
-- Usage: word-extract-html.applescript <docPath> <outHtmlPath>
on dismissDialogs()
	try
		tell application "System Events"
			if not (exists process "Microsoft Word") then return
			tell process "Microsoft Word"
				repeat 6 times
					if exists (window 1 whose subrole is "AXDialog") then
						try
							click button 1 of (first window whose subrole is "AXDialog")
						on error
							keystroke return
						end try
						delay 0.3
					else if exists sheet 1 of window 1 then
						try
							click button 1 of sheet 1 of window 1
						on error
							keystroke return
						end try
						delay 0.3
					else
						exit repeat
					end if
				end repeat
			end tell
		end tell
	end try
end dismissDialogs

on run argv
	if (count of argv) < 2 then error "Usage: word-extract-html.applescript <docPath> <outHtmlPath>"
	set docPath to item 1 of argv
	set outPath to item 2 of argv
	try
		do shell script "rm -f " & quoted form of outPath
	end try
	with timeout of 280 seconds
		tell application "Microsoft Word"
			activate
			try
				set display alerts to alerts none
			end try
			delay 0.5
			try
				repeat while (count of documents) > 0
					try
						close document 1 saving no
					on error
						exit repeat
					end try
				end repeat
			end try
			my dismissDialogs()
			open POSIX file docPath
			delay 1.5
			my dismissDialogs()
			if (count of documents) = 0 then error "Word opened 0 documents"
			set theDoc to active document
			save as theDoc file name (POSIX file outPath) file format format HTML
			delay 0.5
			my dismissDialogs()
			try
				close theDoc saving no
			end try
		end tell
	end timeout
	return outPath
end run

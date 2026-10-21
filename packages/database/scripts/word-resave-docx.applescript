#!/usr/bin/osascript
-- Open .doc/.docx in Microsoft Word and Save As .docx (OOXML) unattended.
-- Suppresses Word alerts; dismisses leftover UI dialogs with Return.
-- Usage: word-resave-docx.applescript <inDocPath> <outDocxPath>
-- Prefer ASCII paths under /tmp to avoid NFD Vietnamese path issues.
on dismissDialogs()
	-- Best-effort: confirm/OK/Yes default buttons that block automation
	try
		tell application "System Events"
			if not (exists process "Microsoft Word") then return
			tell process "Microsoft Word"
				repeat 8 times
					if exists (window 1 whose subrole is "AXDialog") then
						try
							click button 1 of (first window whose subrole is "AXDialog")
						on error
							keystroke return
						end try
						delay 0.4
					else if exists sheet 1 of window 1 then
						try
							click button 1 of sheet 1 of window 1
						on error
							keystroke return
						end try
						delay 0.4
					else
						exit repeat
					end if
				end repeat
			end tell
		end tell
	end try
end dismissDialogs

on run argv
	if (count of argv) < 2 then error "Usage: word-resave-docx.applescript <inDocPath> <outDocxPath>"
	set inPath to item 1 of argv
	set outPath to item 2 of argv

	-- Avoid "replace existing?" prompt
	try
		do shell script "rm -f " & quoted form of outPath
	end try

	with timeout of 900 seconds
		tell application "Microsoft Word"
			activate
			try
				set display alerts to alerts none
			end try
			delay 1.0
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
			delay 0.3
			open POSIX file inPath
			delay 2.0
			my dismissDialogs()
			-- Retry once if Word was still starting / dialog blocked open
			if (count of documents) = 0 then
				delay 1.5
				my dismissDialogs()
				open POSIX file inPath
				delay 2.5
				my dismissDialogs()
			end if
			if (count of documents) = 0 then error "Word opened 0 documents"
			set theDoc to active document
			-- format document + .docx path → OOXML on modern Mac Word
			save as theDoc file name (POSIX file outPath) file format format document
			delay 0.8
			my dismissDialogs()
			try
				close theDoc saving no
			end try
			my dismissDialogs()
			-- Keep alerts suppressed for the batch; next run sets none again
		end tell
	end timeout
	return outPath
end run

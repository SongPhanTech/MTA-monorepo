#!/usr/bin/osascript
-- Extract plain text from a .doc/.docx via Microsoft Word.
-- Usage: word-extract-text.applescript <docPath> <outTxtPath>
-- Prefer ASCII paths under /tmp. Writes UTF-8 to outTxtPath (no Save As dialog).
on run argv
	if (count of argv) < 2 then error "Usage: word-extract-text.applescript <docPath> <outTxtPath>"
	set docPath to item 1 of argv
	set outPath to item 2 of argv
	with timeout of 280 seconds
		tell application "Microsoft Word"
			activate
			try
				set display alerts to alerts none
			end try
			delay 0.3
			try
				repeat while (count of documents) > 0
					try
						close document 1 saving no
					on error
						exit repeat
					end try
				end repeat
			end try
			open POSIX file docPath
			delay 1
			if (count of documents) = 0 then error "Word opened 0 documents"
			set theDoc to active document
			set theText to content of text object of theDoc
			try
				close theDoc saving no
			end try
			try
				set display alerts to alerts all
			end try
		end tell
		-- Write outside Word tell (avoids Save As encoding dialog / huge return)
		set fRef to open for access (POSIX file outPath) with write permission
		set eof of fRef to 0
		write theText to fRef as «class utf8»
		close access fRef
	end timeout
	return outPath
end run

#!/usr/bin/osascript
-- Open .doc/.docx in Microsoft Word and Save As .docx (OOXML).
-- On Mac Word, `format XML document` does not exist; use `format document`
-- with a .docx path — modern Word writes OOXML.
-- Usage: word-resave-docx.applescript <inDocPath> <outDocxPath>
-- Prefer ASCII paths under /tmp to avoid NFD Vietnamese path issues.
on run argv
	if (count of argv) < 2 then error "Usage: word-resave-docx.applescript <inDocPath> <outDocxPath>"
	set inPath to item 1 of argv
	set outPath to item 2 of argv
	with timeout of 900 seconds
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
			open POSIX file inPath
			delay 1.5
			if (count of documents) = 0 then error "Word opened 0 documents"
			set theDoc to active document
			save as theDoc file name (POSIX file outPath) file format format document
			delay 0.8
			try
				close theDoc saving no
			end try
			try
				set display alerts to alerts all
			end try
		end tell
	end timeout
	return outPath
end run

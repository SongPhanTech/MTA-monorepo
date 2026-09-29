#!/usr/bin/osascript
-- Save .doc/.docx as HTML via Microsoft Word (keeps inline images).
-- Usage: word-extract-html.applescript <docPath> <outHtmlPath>
on run argv
	if (count of argv) < 2 then error "Usage: word-extract-html.applescript <docPath> <outHtmlPath>"
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
			save as theDoc file name (POSIX file outPath) file format format HTML
			delay 0.4
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

#!/usr/bin/env ruby
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

def check_git_modified_files
    res = `/opt/homebrew/bin/git diff --name-only`.split(/[\r\n]+/)
    if res.length > 0
        $stderr.puts "Error -- you have checked out files."
        $stderr.puts "All must be checked in before you can deploy."
        exit 1
    end
end

def send_out(out, line, state)
    out.puts line unless state == :STOP
end

def copy_to_temp_cleaning(file_name, out_filename)
    File.open(out_filename, "w") do |out|
        @state = :KEEP
        File.open(file_name, "r") do |inf|
            inf.each_line do |line|
                case line
                    when /PRODUCTION:REMOVE-NEXT-LINE/
                        @state = :SKIP unless @state == :STOP
                        next

                    when /PRODUCTION:REMOVE/
                        next

                    when /PRODUCTION:UNCOMMENT/
                        if line =~ /^(\s*)\/\/(\s*\S.*)\/\/\s*PRODUCTION:UNCOMMENT\s*$/
                            send_out(out, "#{$1}#{$2}", @state)
                        elsif line =~ /^(\s*){#(\s*\S.*?)\s*PRODUCTION:UNCOMMENT\s*#}$/
                            send_out(out, "#{$1}#{$2}", @state)
                        elsif line =~ /^(\s*)<!--(\s*\S.*?)\s*PRODUCTION:UNCOMMENT\s*-->\s*$/
                            send_out(out, "#{$1}#{$2}", @state)
                        else
                            send_out(out, line, @state)
                        end

                    when /PRODUCTION:STOP/
                        @state = :STOP
                else
                    unless @state == :STOP
                        send_out(out, line, @state) unless @state == :SKIP
                        @state = :KEEP
                    end
                end
            end
        end
    end
end

# ----
if ARGV.length == 0
    check_git_modified_files()
end

res = `/opt/homebrew/bin/rg -l PRODUCTION | grep -v clean-for-production.rb`
files = res.split(/[\r\n]+/)

files.each do |file_name|
    copy_to_temp_cleaning(file_name, "tmp_file")
    File.rename("tmp_file", file_name)
end

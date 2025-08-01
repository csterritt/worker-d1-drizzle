#!/usr/bin/env ruby
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

@next_version = -1
File.open("new-version.ts", "w") do |output|
    File.open("src/version.ts", "r") do |input|
        input.each_line do |line|
            if line =~ /^(.*version\s*=\s*')(\d+)'/
                prefix = $1
                @next_version = $2.to_i + 1
                line = "#{prefix}#{@next_version}\'"
            end
            output.puts line
        end
    end
end
File.rename("new-version.ts", "src/version.ts")

if @next_version == -1
    $stderr.puts "Version update failed!"
    exit 1
else
    puts "Updated version to #{@next_version}"
end

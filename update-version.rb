#!/usr/bin/env ruby
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

require 'json'

puts '::: ---  ---- ---- --- :::'

# expects a string that includes `.json`
out_filename = ARGV[0]

# collect all the json files in the current directory
files = Dir.glob('**/*.json')

# take the list of json files found in the dir and combine them all
j = files.map { |f| JSON.parse File.read("#{f}") }.flatten

# open (or create if it doesnt exist) the out_filename and write the combined JSON to it
File.open(out_filename, 'a+') { |f| f.write(j.to_json)  }

puts '::: ---  COMPLETE  --- :::'

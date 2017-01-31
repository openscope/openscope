require 'json'

# This tool will find all the json files in a directory and combine
# them into a single json file.
#
# USING THIS TOOL IS DESTRUCTIVE!!
# Any time this tool is used *it will overwrite any existing content in
# the taget out_file*.  Use with caution
#
# This tool expects that the `@out_filename` already exists within the current directory
#
# useage:
# - cd into the directory you plan to have the combined json file (ex: ./assets/aircraft/)
# - `ruby ../../tools/json_assembler.rb aircraft`

# expects a string that does not include `.json`
@out_filename = ARGV[0]
@json_output = {}
# create an empty array for us to place the contents of each file. each file is
# assumed to be valid json with a single octet at its root.
@json_output[@out_filename] = []

# loop through each json file in the dir except the `out_filename`
# parse it into a hash
# add them to the root key (@out_filename) in the hash
def combine_json_files
  # collect all the json files in the current directory and add them all to the hash
  Dir.glob('**/*.json').select{ |name| name != "#{@out_filename}.json" }.map { |f|
    item = JSON.parse File.read(f)

    add_item_to_json_out_filename(item)
  }
end

def add_item_to_json_out_filename(item)
  @json_output[@out_filename] << item
end

def write_combined_json_to_file()
  # open the @out_filename and write (destructively) the combined JSON to it
  File.open("#{@out_filename}.json", 'w+') do |f|
    f.write(@json_output.to_json)
  end
end

puts '::: ---  ---- ---- --- :::'

combine_json_files
write_combined_json_to_file

puts '::: ---  COMPLETE  --- :::'

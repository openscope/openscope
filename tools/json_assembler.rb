require 'json'

# This tool will find all the json files in a directory and combine
# them into a single json file.
#
# USING THIS TOOL MAY BE DSTRUCTIVE!!
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

# existing airline files do not contain an airline identifier (icao), we add that in programatically here
def add_icao_to_airline_and_combine_json
  # collect all the json files in the current directory and add them all to the hash
  Dir.glob('**/*.json').select{ |name| name != "#{@out_filename}.json" }.map { |f|
    airline = JSON.parse File.read(f)
    # grab the airline icao from the file name
    airline_icao = "#{f.split('.')[0]}"
    # some airline files may already specify an `icao`, we dont want to overwrite that
    unless airline['icao']
      # otherwise create a new key in the hash and set it to the airline_icao
      airline['icao'] = airline_icao
    end

    # add the original file contents, plus our new `icao` key value pair to the out_filename array
    add_item_to_json_out_filename(airline)
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

if @out_filename == 'airlines'
  add_icao_to_airline_and_combine_json
else
  combine_json_files
end

write_combined_json_to_file

puts '::: ---  COMPLETE  --- :::'

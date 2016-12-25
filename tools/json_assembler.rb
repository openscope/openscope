require 'json'


# expects a string that does not include `.json`
@out_filename = ARGV[0]
# read the current file and turn it into a hash
# we really just want the root key, which should match the @out_filename
@j = JSON.parse(File.read("#{@out_filename}.json"));

# loop through each json file in the dir
# parse it into a hash
# add them to the root key (@out_filename) in the hash
def combine_json_files
  # collect all the json files in the current directory
  # take the list of json files found in the dir and combine them all
  @j[@out_filename] << Dir.glob('**/*.json').map { |f| JSON.parse File.read(f) }.flatten
end

def add_icao_to_airline_and_combine_json
  # collect all the json files in the current directory
  # take the list of json files found in the dir and combine them all
  @j[@out_filename] << Dir.glob('**/*.json').map { |f|
    airline = JSON.parse File.read(f)
    # grab the airline icao from the file name
    airline_icao = "#{f.split('.')[0]}"
    # create a new key in the hash and set it to the airline_icao
    airline['icao'] = airline_icao

    airline
  }.flatten
end

def write_combined_json_to_file()
  # open (or create if it doesnt exist) the @out_filename and write the combined JSON to it
  File.open("#{@out_filename}.json", 'w+') do |f|
    f.write(JSON.pretty_generate(@j))
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

# This script shall be sourced in a bash shell, because of the **geotriples-cmd**  alias
# that needs to be inherited by this script
#
# Usage:
# source convert_dataset_1.sh  input_file.xml output_file.rdf


# Check if script has been sourced
$(return >/dev/null 2>&1)

# What exit code did that give?
if [ "$?" -eq "0" ]
then

  # If 2 parameters
  if [ $# -eq 2 ]
    then
      INPUT_XML=$1   # e.g. input_test_dataset_1.xml
      OUTPUT_RDF=$2  # e.g. output_test_dataset_1.rdf
      RML=OGC-EOP-OM-2-RDF-mapping.rml.ttl
      RML_TEMP=${RML}"."${INPUT_XML}

      sed "s#__INPUT_XML__#${INPUT_XML}#g" ${RML} > ${RML_TEMP}

      printf "Convert $1 to $2\n"
      geotriples-cmd dump_rdf -ns test_dataset_namespaces.ns -o "${OUTPUT_RDF}" -rml "${RML_TEMP}"

      rm "${RML_TEMP}"
    
      printf "Conversion done in $2\n"

  # If not 2 parameters
  else
      printf "Please provides input and output filenames as arguments.\n"
      printf "Example: source convert_dataset_1.sh  input_file.xml output_file.rdf\n"
  fi
# If scripts has not been sourced
else
    printf "This script must be sourced.\n"
    printf "source `basename "$0"`  input_file.xml output_file.rdf\n"
fi

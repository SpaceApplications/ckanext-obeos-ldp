_src
====

_You may drop your custom source code here._

<br>

## CKAN

CKAN is directly cloned from GitHub by the Dockerfile.

If needed:

Clone CKAN:

	git clone https://github.com/ckan/ckan.git

## Extensions

The OBEOS LDP extension is packed in `ckanext-obeos.tar.gz`.

It is unpacked in the DockerFile of the CKAN container.

You can also replace the content of the `tar.gz` file by more recent code.

Clone them here as well.

## Dependencies

Pip requirements are installed when the image is built.
All you need is a requirement file named `requirements.txt` or `pip-requirements.txt`


This **OBEOS Linked Data Prototype** software is part of ESA project *Ontology Based Earth Observation Search* (OBEOS).

The **Linked Data Prototype** (LDP) is an ontology‑based resolving service for resources compliant with the Linked Data conventions, which integrates with existing EO facilities via standardized protocols.

The software, implemented as a CKAN plugin, provides users with the possibility to perform textual search and navigation into EO Datasets.

Read more about the ESA OBEOS project on the ESA RSS Web portal: http://wiki.services.eoportal.org/tiki-index.php?page=OBEOS.

## Installation

1. Generate the CKAN Extension tar.gz
 ```bash
 cd ldp-install/docker.centos7/_src/
 ./fetchCKANext_OBEOS.sh   
 ```

2. Build with docker-compose
 ```bash
 cd ldp-install/docker.centos7
 docker-compose build   
 ```

3. Run (this take a couple of minutes to go through the entire initialization)
```bash
docker-compose up  # (from 'ldp-install/docker.centos7' dir)
```

4. Open the 'OBEOS Linked Data Prototype'

Open a browser at: [http://localhost](http://localhost)

5. Stop the 'OBEOS Linked Data Prototype'
```bash
docker-compose stop  # (from 'ldp-install/docker.centos7' dir)
```


## Troubleshooting

  If the following error is raised during the building of the containers:
  > Error unpacking rpm package httpd-2.4.6-40.el7.centos.4.x86_64

  This means that the storage-driver of your installation shall be set to *devicemapper* (and not *aux*)
  To do so, execute the following commands:
  ```bash
  sudo service docker stop
  sudo dockerd --storage-driver=devicemapper &
  sudo service docker start
  docker-compose build  # (from 'ldp-install/docker.centos7' dir)
  ```

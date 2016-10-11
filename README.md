The **OBEOS Linked Data Prototype** (LDP) software is an ontology‑based resolving service for resources compliant with the Linked Data conventions, which integrates with existing EO facilities via standardized protocols.

In particular, it is capable of querying and visualizing metadata compliant with the schema proposed in the OGC specification OGC 16-074 *EO Metadata Discovery using Linked Data* v0.2.0, 25-Mar-2016. OGC Members may obtain the pending document at the following address: https://portal.opengeospatial.org/files/?artifact_id=68075&version=1.

The software, implemented as a CKAN plugin, provides users with the possibility to perform textual search and navigation into EO Datasets.

The work on this software has been performed under a contract with Spacebel s.a. for ESA/ESRIN in the context of the *Ontology Based Earth Observation Search* (OBEOS) project.

Read more about the ESA OBEOS project on the ESA RSS Web portal: http://wiki.services.eoportal.org/tiki-index.php?page=OBEOS.

## Installation

1. Clone the repository
 ```bash
 git clone https://github.com/SpaceApplications/ckanext-obeos-ldp.git
 ```
 
2. Generate the CKAN Extension tar.gz
 ```bash
 cd ldp-install/docker.centos7/_src/
 ./fetchCKANext_OBEOS.sh   
 ```

4. Build with docker-compose
 ```bash
 # (from root dir)
 cd ldp-install/docker.centos7
 docker-compose build   
 ```

5. Run (this take a couple of minutes to go through the entire initialization)
 ```bash
 docker-compose up   # (from 'ldp-install/docker.centos7' dir)
 ```

6. Open the **OBEOS Linked Data Prototype**

 Open a browser at: [http://localhost](http://localhost)

7. Stop the **OBEOS Linked Data Prototype**
 ```bash
 docker-compose stop   # (from 'ldp-install/docker.centos7' dir)
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

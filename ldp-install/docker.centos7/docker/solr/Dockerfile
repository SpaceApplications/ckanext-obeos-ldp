FROM dockercentos7_centos-base:latest
MAINTAINER Space Applications Services

RUN yum -q -y update

# Install Java
RUN yum -y install \
        default-jre-headless \
        java-1.7.0-openjdk \
        wget

# Install Solr
ENV SOLR_HOME /opt/solr/example/solr
ENV SOLR_VERSION 4.10.1
ENV SOLR solr-$SOLR_VERSION
RUN mkdir -p /opt/solr
RUN wget --progress=bar:force https://archive.apache.org/dist/lucene/solr/$SOLR_VERSION/$SOLR.tgz
RUN tar zxf $SOLR.tgz -C /opt/solr --strip-components 1

# Install CKAN Solr core
RUN cp -R $SOLR_HOME/collection1/ $SOLR_HOME/ckan/
RUN echo name=ckan > $SOLR_HOME/ckan/core.properties
ADD schema.xml $SOLR_HOME/ckan/conf/schema.xml
ONBUILD COPY schema.xml $SOLR_HOME/ckan/conf/schema.xml

# Configure runit
ADD ./svc /etc/service/
CMD ["/sbin/my_init"]

VOLUME  ["/opt/solr/example/solr/ckan/conf/","/var/lib/solr/solr"]
EXPOSE 8983

RUN yum clean headers && yum clean packages  && rm -rf /var/lib/yum/yumdb/* /tmp/* /var/tmp/* $SOLR.tgz

# Disable SSH
RUN rm -rf /etc/service/sshd /etc/my_init.d/00_regen_ssh_host_keys.sh

FROM dockercentos7_centos-base:latest
MAINTAINER Space Applications Services

RUN yum -y install epel-release
RUN yum -q -y update

# Add PostgreSQL, HDF5 repo to yum
RUN rpm -iUvh http://yum.postgresql.org/9.3/redhat/rhel-7-x86_64/pgdg-centos93-9.3-1.noarch.rpm


# Needed to install PostGIS later on
#RUN rpm -ivh http://dl.fedoraproject.org/pub/epel/7/x86_64/e/epel-release-7-5.noarch.rpm


# Install PostgreSQL and PostGIS
RUN yum -y install \
        postgresql \
        postgresql-server \
        postgresql-contrib \
        postgis \
        inotify-tools

# User with DBCREATE privileges, that can be used in Strabon or CKAN containers to create a DB
ENV DBCREATE_USER dbcreate_user
ENV DBCREATE_PASS change_me
ENV DBCREATE_DB dbcreate_db

# default credentials if none have been provided at runtime
# you should at least set a secure passwords
ENV CKAN_DB ckan
ENV CKAN_USER ckan_user
ENV CKAN_PASS change_me

ENV DATASTORE_DB datastore
ENV DATASTORE_USER datastore_user
ENV DATASTORE_PASS change_me

ENV PGDATA /var/lib/pgsql/data/
ENV PGMAIN /etc/postgresql/9.3/main
#ENV PGMAIN /var/lib/pgsql/data/
RUN mkdir -p $PGDATA && chown -R postgres $PGDATA && chmod -R 700 $PGDATA

# Allow connections from anywhere with valid credentials (md5)
#RUN sudo -u postgres /usr/bin/initdb $PGDATA
#RUN sed -i -e "s|^#listen_addresses =.*$|listen_addresses = '*'|" $PGMAIN/postgresql.conf
#RUN echo "host    all    all    0.0.0.0/0    md5" >> $PGMAIN/pg_hba.conf

# Configure runit
ADD ./svc /etc/service/
CMD ["/sbin/my_init"]

#VOLUME ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]
VOLUME ["/etc/postgresql", "/var/log/postgresql", "/var/lib/pgsql"]
EXPOSE 5432

RUN yum clean headers && yum clean packages  && rm -rf /var/lib/yum/yumdb/* /tmp/* /var/tmp/*

# Disable SSH
RUN rm -rf /etc/service/sshd /etc/my_init.d/00_regen_ssh_host_keys.sh

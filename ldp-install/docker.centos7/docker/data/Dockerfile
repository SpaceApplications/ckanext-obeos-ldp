FROM dockercentos7_centos-base:latest
MAINTAINER Space Applications Services

ENV CKAN_DATA /var/lib/ckan
#ENV PGDATA /var/lib/postgresql/9.3/main
ENV PGDATA /var/lib/pgsql/data
ENV PGMAIN /etc/postgresql/9.3/main

# apache or www-data not existing at this point ????? SHALL BE FIXED
RUN useradd www-data
RUN mkdir -p $CKAN_DATA && chown -R www-data:www-data $CKAN_DATA

RUN echo "postgres:x:107:" >> /etc/group
RUN echo "postgres:x:103:107:PostgreSQL administrator,,,:/var/lib/postgresql:/bin/bash" >> /etc/passwd
RUN mkdir -p $PGDATA && chown -R postgres:postgres $PGDATA
RUN mkdir -p $PGMAIN && chown -R postgres:postgres $PGMAIN

CMD ["/sbin/my_init"]

#VOLUME ["/var/lib/ckan", "/etc/postgresql/9.3/main", "/var/lib/postgresql/9.3/main", "/HELLO"]
VOLUME ["/var/lib/ckan", "/etc/postgresql/9.3/main", "/var/lib/pgsql/data"]

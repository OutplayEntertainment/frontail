FROM iojs:onbuild

ENV VERSION 1.0.0
EXPOSE 25252
ENTRYPOINT ["/usr/local/bin/iojs", "index.js", "-p", "25252", "-n", "100"]
CMD ["--help"]

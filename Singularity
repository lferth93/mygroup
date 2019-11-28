Bootstrap: docker

From: node:buster-slim

%runscript
   opt="$USER"

   if [ $# -gt 0 ]; then
      case "$1" in
         -h|--help)
            node main.js --help
            exit 1
            ;;
         *)
            echo  "La opcion $1 es invalida."
            node main.js --help
            exit 1
            ;;
      esac
   fi

   uid=$(id -u $USER)

   if [ $uid -gt 5000 ] && [ $uid -lt 6001 ]
   then
      cd /myjobs
      node main.js "$opt" 2> /dev/null
   else
      echo 'Acceso denegado'
   fi


%setup
    mkdir -p ${SINGULARITY_ROOTFS}/mygroup

%files
    ./cpubar.js mygroup/cpubar.js
    ./main.js mygroup/main.js
    ./statebar.js mygroup/statebar.js
    ./query.json mygroup/query.json
    ./package.json mygroup/package.json

%post 
    cd /mygroup
    npm install

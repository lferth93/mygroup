Bootstrap: docker

From: node:alpine

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
      cd /apps
      node main.js "$opt" 2> /dev/null
   else
      echo 'Acceso denegado'
   fi


%setup
    mkdir -p ${SINGULARITY_ROOTFS}/app

%files
    ./cpubar.js app/cpubar.js
    ./main.js app/main.js
    ./statebar.js app/statebar.js
    ./query.json app/query.json
    ./package.json app/package.json

%post 
    cd /app
    npm install

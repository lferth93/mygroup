Bootstrap: docker

From: node:alpine

%runscript
   opt="$USER"
   debug=false

   if [ $# -gt 0 ]; then
      case "$1" in
         -h|--help)
            node main.js --help
            exit 1
            ;;
         --debug)
            debug=true
            shift 1
            ;;
         *)
            echo  "La opcion $1 es invalida."
            node main.js --help
            exit 1
            ;;
      esac
   fi

   cd /app

   if [ $debug==true ];then
      node main.js $@
   else
      uid=$(id -u $USER)

      if [ $uid -gt 5000 ] && [ $uid -lt 6001 ]
      then
         node main.js "$opt" 2> /dev/null
      else
         echo 'Acceso denegado'
      fi
   fi

%setup
    mkdir -p ${SINGULARITY_ROOTFS}/app

%files
    ./cpubar.js app/cpubar.js
    ./main.js app/main.js
    ./statebar.js app/statebar.js
    ./query.json app/query.json
    ./package.json app/package.json

%environment
    ES_SLURM_DB='148.206.50.80:9200'
    export ES_SLURM_DB

%post 
   mkdir /LUSTRE
   touch /etc/localtime
    cd /app
    npm install

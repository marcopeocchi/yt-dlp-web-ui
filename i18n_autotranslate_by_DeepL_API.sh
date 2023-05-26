#!/bin/bash
# shellcheck disable=SC2181,SC2317,SC2001

    ################################################################################################
    # automatic translation script with DeepL                                                      #
    #     v1.0 © 2023 by geimist                                                                   #
    #                                                                                              #
    ################################################################################################


# Description:
#---------------------------------------------------------------------------------------------------
#   This script reads the file with the language strings in YAML format (defined in the ${masterFile} variable).
#   A sqlite database is created and all language strings are stored in it as keys and strings. 
#   Via the API of DeepL all available translations are retrieved (a free DeepL API key is required / 50,000 characters per month are free).
#   Afterwards a new language file with all translations is output at the desired target path.
#
#   When updating a string of the source language, only this string will be translated. So it is possible to keep all translations up to date without any effort.
#
#   Requirement: yq must be installed for reading in
#
#---------------------------------------------------------------------------------------------------
    DeepLapiKey=""
    # Fallback key from external file (at parent dir):
    DeepLapiKey="${DeepLapiKey:-$(head -n1 "$(realpath "${0%/*}/../DeepL_api-Key.txt")")}"

# Master language:
#---------------------------------------------------------------------------------------------------
    # This file in YAML format defines the variables and serves as a language template:
    # only single strings are to be updated or variables have been added, 
    # only these values are needed in the file. Existing equal values are skipped.

    # file structure:
    # ---
    # languages:
    #   <language_name>:
    #     key1: value
    #     key2: value

    masterFile="${0%/*}/frontend/src/assets/i18n.yaml"

    # Language code of the pattern language (language of the master table):
    # this language serves as the source translation for DeepL.
    masterLangName="english"

# Database:
#---------------------------------------------------------------------------------------------------
    # Path for the language DB
    # - all strings are stored in this DB
    # - the required language strings for the YAML file are generated from it (function: export_langfiles)
    # - if the DB does not exist, it will be recreated
    i18n_DB="${0%/*}/i18n.sqlite"

# Export of translated language strings
#---------------------------------------------------------------------------------------------------
    # should the language files be exported finally?:
    exportLangFiles=1

    # Path of export file:
    exportFile="${masterFile}_2.yaml"
    
    # should already existing language files be overwritten?:
    overwrite=1


####################################################################################################


set -E -o functrace

# the version is set for the master table and shows whether individual translation strings are current or outdated
langVersion=1

cCount=0
error=0
date_start=$(date +%s)

[ ! "$(which yq)" ] && echo "ERROR: yq is not installed - EXIT" && exit 1

sec_to_time () {
# this function converts a second value to hh:mm:ss
# call: sec_to_time "string"
# https://blog.jkip.de/in-bash-sekunden-umrechnen-in-stunden-minuten-und-sekunden/
#-------------------------------------------------------------------------------
    local seconds="$1"
    local sign=""
    if [[ ${seconds:0:1} == "-" ]]; then
        seconds=${seconds:1}
        sign="-"
    fi
    local hours=$(( seconds / 3600 ))
    local minutes=$(( (seconds % 3600) / 60 ))
    seconds=$(( seconds % 60 ))
    printf "%s%02d:%02d:%02d" "${sign}" "${hours}" "${minutes}" "${seconds}"
}
trap 'echo "runtime: $(sec_to_time $(expr $(date +%s)-${date_start}) )" ; exit' EXIT

progressbar() {
# https://blog.cscholz.io/bash-progress-or-spinner/
# Um die Progressbar darzustellen, muss ein Zähler (_start) und der Maximalwert (_end) definiert werden.
#   _start=0
#   _end=$(wc -l $1)
#######################################
# Display a progress bar
# Arguments:
#   $1 Current loop number
#   $2 max. no of loops (1005)
# Returns:
#   None
#######################################

# Process data
    _progress=$((($1 * 100) / $2))
    _done=$((_progress * 4 / 10))
    _left=$((40 - _done))

# Build progressbar string lengths
_fill=$(printf "%${_done}s")
_empty=$(printf "%${_left}s")

printf "\rProgress :    [${_fill// /#}${_empty// /-}] ${_progress}%% ($1/$2)"

}

create_db() {
# this function creates the database if it is not present or empty

if [ ! -s "${i18n_DB}" ]; then
    printf "\n\nNo i18n database was found - it is being created now ...\n\n"

    sqlite3 "$i18n_DB" "BEGIN TRANSACTION;
                        DROP TABLE IF EXISTS \"strings\";
                        CREATE TABLE IF NOT EXISTS \"strings\" (
                            \"ID\" INTEGER,
                            \"varID\" INTEGER,
                            \"langID\" INTEGER,
                            \"version\" INTEGER,
                            \"verified\" INTEGER DEFAULT 0, 
                            \"langstring\" TEXT,
                            PRIMARY KEY(\"ID\" AUTOINCREMENT),
                            FOREIGN KEY(\"varID\") REFERENCES \"variables\"(\"varID\")
                        );
                        DROP TABLE IF EXISTS \"master_template\";
                        CREATE TABLE IF NOT EXISTS \"master_template\" (
                            \"ID\" INTEGER,
                            \"varID\" INTEGER,
                            \"langID\" INTEGER DEFAULT 1,
                            \"version\" INTEGER,
                            \"timestamp\" TEXT,
                            \"langstring\" TEXT,
                            PRIMARY KEY(\"ID\" AUTOINCREMENT)
                        );
                        DROP TABLE IF EXISTS \"languages\";
                        CREATE TABLE IF NOT EXISTS \"languages\" (
                            \"langID\" INTEGER,
                            \"deeplshortname\" TEXT,
                            \"longname\" TEXT UNIQUE,
                            \"longnamenativ\" TEXT,
                            \"longnamedisplay\" TEXT,
                            PRIMARY KEY(\"langID\" AUTOINCREMENT)
                        );
                        DROP TABLE IF EXISTS \"variables\";
                        CREATE TABLE IF NOT EXISTS \"variables\" (
                            \"varID\" INTEGER,
                            \"varname\" TEXT UNIQUE,
                            \"verified\" INTEGER DEFAULT 0, 
                            \"inuse\" VARCHAR DEFAULT ('true'),
                            PRIMARY KEY(\"varID\" AUTOINCREMENT)
                        );
                        INSERT INTO \"languages\" VALUES 
                            (1,'BG','bulgarian','Български','Bulgarian'),
                            (2,'CS','czech','česky','Czech'),
                            (3,'DA','danish','dansk','Danish'),
                            (4,'DE','german','deutsch','German'),
                            (5,'EL','greek','Ελληνική','Greek'),
                            (6,'EN-GB','english_gb','englisch (British)','English (British)'),
                            (7,'EN-US','english','english (American)','English (American)'),
                            (8,'ES','spanish','español','Spanish'),
                            (9,'ET','estonian','eesti','Estonian'),
                            (10,'FI','finnish','suomalainen','Finnish'),
                            (11,'FR','french','français','French'),
                            (12,'HU','hungarian','magyar','Hungarian'),
                            (13,'ID','indonesian','indonesia','Indonesian'),
                            (14,'IT','italian','italiano','Italian'),
                            (15,'JA','japanese','ジャパニーズ','Japanese'),
                            (16,'KO','korean','한국어','Korean'),
                            (17,'LT','lithuanian','lietuviškas','Lithuanian'),
                            (18,'LV','latvian','latvieši','Latvian'),
                            (19,'NB','norwegian','norsk','Norwegian (Bokmål)'),
                            (20,'NL','dutch','nederlands','Dutch'),
                            (21,'PL','polish','polski','Polish'),
                            (22,'PT-BR','portuguese_br','português do Brasil','Portuguese (Brazilian)'),
                            (23,'PT-PT','portuguese','português','Portuguese'),
                            (24,'RO','romanian','românesc','Romanian'),
                            (25,'RU','russian','русский','Russian'),
                            (26,'SK','slovak','slovenské','Slovak'),
                            (27,'SL','slovenian','slovenski','Slovenian'),
                            (28,'SV','swedish','svenska','Swedish'),
                            (29,'TR','turkish','TÜRKÇE','Turkish'),
                            (30,'UK','ukrainian','український','Ukrainian'),
                            (31,'ZH','chinese','中文','Chinese (simplified)');
                        COMMIT;"
fi

}

create_master() {
    # this function reads the pattern file, defines from it the needed variable names and their values and writes them into the DB
    # if variable names already exist, the values are updated and the version counter of the variable is incremented by 1

    # set progressbar:
    printf "\n\n%s\n"  "Import / update master table ..."
    printf "%s\n\n" "[Masterfile: ${masterFile}]"

    masterContent="$(yq ".languages.${masterLangName}" "${masterFile}")"

    progress_end=$(grep -vc "^$" <<< "${masterContent}")
    
    cCount=0
    insertCount=0

    langID=$(sqlite3 "${i18n_DB}" "SELECT langID FROM languages WHERE longname='${masterLangName}'")

    # set previous variables to false to set only those of the master table to active
    sqlite3 "${i18n_DB}" "UPDATE variables SET inuse = false;"
    
    while read -r line; do
        # Define the pattern with a regular expression
        pattern="([^:]+): (.*)"

        # Check if the string matches the pattern
        if [[ ${line} =~ ${pattern} ]]; then
            # Extract the key and the value from the matches
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
        else
            echo "The string does not match the expected pattern:"
            echo ">   ${line}"
            continue
        fi

        # Progressbar:
        cCount=$((cCount+1))
        progressbar "${cCount}" "${progress_end}"

        # write the variable name of the line into the DB / skip existing:
        if ! sqlite3 "${i18n_DB}" "INSERT OR IGNORE INTO variables ( varname ) VALUES ( '${key}' )"; then
            echo "! ! ! ERROR @ LINE: INSERT OR IGNORE INTO variables ( varname ) VALUES ( '${key}' )"
        fi

        # set used variable to true:
        sqlite3 "${i18n_DB}" "UPDATE variables SET inuse = true WHERE varname='${key}';"

        # identify the ID of the current variable to link the value to the string table:
        varID=$(sqlite3 "${i18n_DB}" "SELECT varID FROM variables WHERE varname='${key}'")

        # read info of a possibly existing version - check if an update is necessary and increase the version if necessary:
        checkValue=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT ID, version, langstring FROM master_template WHERE varID='${varID}' AND langID='${langID}'" | head -n1)

        # if the line exists, it will be updated, otherwise a new one will be created ("INSERT OR REPLACE …"):
        rowID=$(echo "${checkValue}" | awk -F'\t' '{print $1}')
        if [ -n "${rowID}" ]; then
            IDname="ID, "
            rowID="'${rowID}',"
        else
            IDname=""
            rowID=""
        fi

        # if the record is only updated, then its version increases by 1 / if it is new, version 1 is defined:
        checkVersion=$(echo "${checkValue}" | awk -F'\t' '{print $2}')
        if [ -z "${checkVersion}" ]; then
            langVersion=1
        else
            langVersion=$((checkVersion + 1))
        fi

        # compare new with existing data set - continue if no change:
        checkLangstring=$(echo "${checkValue}" | awk -F'\t' '{print $3}')
        if [ "${checkLangstring}" == "${value}" ]; then
            continue
        else
            # mask single quotes for SQL commit:
            value=$(echo "${value}" | sed -e "s/'/''/g")
        fi

        # save the values in the master table:
        if ! sqlite3 "${i18n_DB}" "INSERT OR REPLACE INTO master_template ( $IDname varID, langID, version, timestamp, langstring  ) VALUES (  $rowID '$varID','$langID','$langVersion',(datetime('now','localtime')),'$value' ) "; then
            echo "! ! ! ERROR @ LINE: INSERT OR REPLACE INTO master_template ( $IDname varID, langID, version, timestamp, langstring  ) VALUES (  $rowID '$varID','$langID','$langVersion',(datetime('now','localtime')),'$value' )"
        else
            insertCount=$((insertCount + 1))
        fi
    done <<< "${masterContent}"
    
    printf "\n\n%s\n" "Es wurden ${insertCount} Datensätze in die Mastertabelle eingefügt, bzw. aktualisiert."

}

translate() {
    # this function lists the table with the sample translation and translates it if it is missing 
    # in the target language or its version does not match the version in the master table

    printf "\n\n%s\n" "Check for missing or outdated translations and update if necessary ... "
    printf "%s\n\n" "    Master language-ID:     ${masterLangID} [${masterLongName}]"

    while read -r langID; do
        unset skipped  # verified entries are not automatically translated but finally output
        languages=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT deeplshortname, longname FROM languages WHERE langID='${langID}'")
        targetDeeplShortName="$(echo "${languages}" | awk -F'\t' '{print $1}')"
        targetLongName="$(echo "${languages}" | awk -F'\t' '{print $2}')"
        printf "\n\n%s\n" "verarbeite Sprach-ID: ${langID} [${targetLongName}]"

        # read current version of master table and translation table
        masterList=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT t1.varID, t1.version FROM (master_template t1, variables t2) WHERE t1.varID = t2.varID AND inuse='1' AND t1.langID='${masterLangID}';" | sort -g)
        langList=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT varID, version FROM strings WHERE langID='${langID}'" | sort -g)

        # search differences:
        diffVar=$(diff -d <(echo "${langList}") <(echo "${masterList}"))
        diffNew=$(echo "${diffVar}" | grep ">" | sed -e 's/^> //g')

        # set progressbar:
        # shellcheck disable=SC2126
        progress_end="$(printf "%s" "${diffNew}" | grep -v "^$" | wc -l | sed -e 's/ //g')"

        cCount=0
        [ "${progress_end}" -eq 0 ] && continue

        if [ "${masterLangID}" = "${langID}" ]; then
            # no translation needed - copy the language from the master table to the translation table:
            
            while read -r varID; do
                # Progressbar:
                cCount=$((cCount+1))
                progressbar "${cCount}" "${progress_end}"

                # read the source data:
                sourceRow=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT version, langstring FROM master_template WHERE langID='${masterLangID}' AND varID='${varID}'" )
                # separate the language version:
                langVersion="$(echo "${sourceRow}" | awk -F'\t' '{print $1}')"
                # separate the language string and mask single quotes for the SQL commit:
                value="$(echo "${sourceRow}" | awk -F'\t' '{print $2}' | sed -e "s/'/''/g")" 

                rowID=$(sqlite3 "${i18n_DB}" "SELECT ID FROM strings WHERE varID='${varID}' AND langID='${langID}'" | head -n1)

                if [ -n "${rowID}" ]; then
                    IDname="ID, "
                    rowID="'${rowID}',"
                else
                    IDname=""
                    rowID=""
                fi
                sqlite3 "${i18n_DB}" "INSERT OR REPLACE INTO strings ( $IDname varID, langID, version, langstring  ) VALUES (  $rowID '$varID','$langID','$langVersion', '$value' ) "

            done <<< "$(echo "${diffNew}" | awk -F'\t' '{print $1}')"
        else
            # Translation needed - target language differs from source language - it is translated and written to the translation table:
            while read -r varID; do

                # Progressbar:
                progressbar "${cCount}" "${progress_end}"

                # read source dataset:
                sourceRow=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT version, langstring FROM master_template WHERE langID='${masterLangID}' AND varID='${varID}'" )
                # separate the language version:
                langVersion="$(echo "${sourceRow}" | awk -F'\t' '{print $1}')"
                # separate the language string:
                value="$(echo "${sourceRow}" | awk -F'\t' '{print $2}')" 
                
                # read target dataset:
                targetRow=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT ID, version, verified, langstring FROM strings WHERE varID='${varID}' AND langID='${langID}'")

                rowID="$(echo "${targetRow}" | awk -F'\t' '{print $1}')"
                # separate the verified flag:
                verified="$(echo "${targetRow}" | awk -F'\t' '{print $3}')"
                # separate the verified language string:
                verifiedValue="$(echo "${targetRow}" | awk -F'\t' '{print $4}')"

                # skip locked (verified) strings:
                if [ "${verified}" = 1 ]; then
                    varName="$(sqlite3 "${i18n_DB}" "SELECT varname FROM variables WHERE varID='${varID}'" )"
                    skipped="$( [ -n "${skipped}" ] && printf "%s\n" "${skipped}")\n    ➜ Name:     ${varName}\n      master:   \"${value}\"\n      verified: \"${verifiedValue}\""
                    continue
                fi

                # call API / translate
                # https://www.deepl.com/de/docs-api/translating-text/
                request_start=$(date +%s)
                transValue=$(curl -s  --connect-timeout 5 \
                    --max-time 5 \
                    --retry 5 \
                    --retry-delay 0 \
                    --retry-max-time 30 \
                    https://api-free.deepl.com/v2/translate \
                    -d auth_key="${DeepLapiKey}" \
                    -d "text=${value}"  \
                    -d "source_lang=${masterDeeplShortName%-*}" \
                    -d "tag_handling=xml" \
                    -d "target_lang=${targetDeeplShortName}" | jq -r .translations[].text)

                if [ "$?" -ne 0 ]; then
                    printf "    TRANSLATION ERROR - skip ..."
                    error=1
                    continue
                elif [ -z "${transValue}" ] && [ -n "${value}" ]; then
                    printf "%s" "    ÜREPLACE ERROR (empty return | varID: ${varID} ) - skip ..."
                    error=1
                    continue
                fi

                # Note for slow DeepL:
                requestTime=$(($(date +%s)-request_start))
                [ "${requestTime}" -gt 10 ] && printf "%s" "  long DeepL response time [${requestTime} seconds] | result: ${transValue}"

                # separate the language string and mask single quotes:
                # shellcheck disable=SC2001
                transValue="$(echo "${transValue}" | sed -e "s/'/''/g")" 

                if [ -n "${rowID}" ]; then
                    IDname="ID, "
                    rowID="'${rowID}',"
                else
                    IDname=""
                    rowID=""
                fi
                sqlite3 "${i18n_DB}" "INSERT OR REPLACE INTO strings ( ${IDname} varID, langID, version, langstring  ) VALUES (  $rowID '$varID','$langID','$langVersion', '$transValue' ) "

                # Progressbar:
                cCount=$((cCount+1))
                progressbar "${cCount}" "${progress_end}"

            done <<< "$(echo "$diffNew" | awk -F'\t' '{print $1}')"

            if [ -n "${skipped}" ]; then
                printf "\n\n%s" "Folgende Übersetzungen wurden geändert, haben jedoch in der bestehenden Version den Status 'verifiziert' und wurden daher nicht automatisch übersetzt / aktualisiert:"
                printf "\n%s\n" "${skipped}"
            fi
        fi
    done <<< "$(sqlite3 "${i18n_DB}" "SELECT langID FROM languages WHERE deeplshortname IS NOT ''")"

}

export_langfile() {
    # This function exports all values from the translation table of the DB to the YAML language file
    printf "\n\n%s\n" "Export the language file ... "

    if [ "${overwrite}" = 0 ] && [ -f "${exportFile}" ]; then
        echo "    ➜ Language file already exists and overwriting is disabled ..."
        exit 1
    fi

    echo "---" > "${exportFile}"
    echo "languages:" >> "${exportFile}"

    while read -r langID; do
        languages=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT longname FROM languages WHERE langID='${langID}'")
        targetLongName="$(echo "${languages}" | awk -F'\t' '{print $1}')"
        printf "\n%s\n" "verarbeite Sprach-ID: ${langID} [${targetLongName}]"

        echo  "  ${targetLongName}:" >> "${exportFile}"
        
        content=$(sqlite3 -separator $': ' "${i18n_DB}" "SELECT varname, langstring FROM strings INNER JOIN variables ON variables.varID = strings.varID WHERE strings.langID='${langID}' AND  variables.inuse='1' ORDER BY varname ASC" )

        while read -r line; do
            echo "    ${line}" >> "${exportFile}"
        done <<< "${content}"
    done <<< "$(sqlite3 "${i18n_DB}" "SELECT DISTINCT langID FROM strings ORDER by langID ASC")"
    
    chmod 755 "${exportFile}"
}

# lRead the current status of the translation contigent from DeepL (characters used in the current period):
limitStateStart=$(curl -sH "Authorization: DeepL-Auth-Key ${DeepLapiKey}" https://api-free.deepl.com/v2/usage)

# Gather information of the defined master language:
languages=$(sqlite3 -separator $'\t' "${i18n_DB}" "SELECT langID, deeplshortname, longname FROM languages WHERE longname='${masterLangName}'")
masterLangID="$(echo "${languages}" | awk -F'\t' '{print $1}')"
masterDeeplShortName="$(echo "${languages}" | awk -F'\t' '{print $2}')"
masterLongName="$(echo "${languages}" | awk -F'\t' '{print $3}')"

#######################
# Function calls:
    create_db
    create_master
    translate
    [ "${exportLangFiles}" = 1 ] && export_langfile
#######################

printf "\n\n%s\n" "Statistics:"
[ "${error}" -ne 0 ] && echo "    There were errors during execution - please call again."
limitState=$(curl -sH "Authorization: DeepL-Auth-Key ${DeepLapiKey}" https://api-free.deepl.com/v2/usage)
printf "%s\n" "    For the translation were used $(( $(jq -r .character_count <<< "${limitState}" )-$(jq -r .character_count <<< "${limitStateStart}" ))) Characters calculated."
printf "%s\n" "    In the current period $(jq -r .character_count <<< "${limitState}" ) characters out of $(jq -r .character_limit <<< "${limitState}" ) possible characters have been consumed."

importClass(java.io.FileWriter);
importClass(java.io.BufferedWriter);
importClass(java.io.FileReader);
importClass(java.io.BufferedReader);
importClass(java.io.File);

staging_folder = project.getProperty("staging_folder");
staging_hardware_folder = project.getProperty("staging_hardware_folder");
conf_file = staging_folder + "/work/" + staging_hardware_folder + "/tools/avr/etc/avrdude.conf";

orig_file = new File(conf_file + ".bak");
new File(conf_file).renameTo(orig_file);

reader = new BufferedReader(new FileReader(orig_file));
writer = new BufferedWriter(new FileWriter(conf_file));

replacements = [
  ["(chip_erase_delay\\s*=\\s*)\\d+", "$1900000"],
  ["(chiperasetime\\s*=\\s*)\\d+", "$1900000"],
  ["(delay\\s*=\\s*)\\d+", "$112"],
  [/(memory\s*"flash")/, "$1"], // ensure we're in the flash block
  ["(min_write_delay\\s*=\\s*)\\d+", "$130000"],
  ["(max_write_delay\\s*=\\s*)\\d+", "$130000"]
];
replacementIdx = 0;
toMatch = new RegExp(replacements[replacementIdx][0]);

function say(line) {
  echo = Arduino.createTask("echo");
  echo.setMessage(line);
  echo.perform();
}

newLine = "";
inBlock = false;
doReplace = true;
line = reader.readLine();
while (line != null) {
  if (!inBlock && line.indexOf("ATtiny85") > -1) {
    say("Found ATtiny85 Block");
    inBlock = true;
    newLine = line;
  } else if (inBlock && doReplace && line.match(toMatch)) {
    rep = replacements[replacementIdx];
    newLine = line.replaceAll(rep[0], rep[1]);
    say("replaced " + line + " with " + newLine);
    replacementIdx++;
    if (replacementIdx >= replacements.length) {
      doReplace = false;
    } else {
      toMatch = new RegExp(replacements[replacementIdx][0]);
    }
  } else {
    newLine = line;
  }

  writer.write(newLine);
  writer.newLine();
  writer.flush();
  line = reader.readLine();
}

reader.close();
writer.close();

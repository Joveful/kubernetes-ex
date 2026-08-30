use std::fs::OpenOptions;
use std::io::Write;
use std::time::Duration;

use chrono::Local;
use uuid::Uuid;

fn write_status_to_file(path: &std::path::Path, id: &Uuid) -> std::io::Result<()> {
    let timestamp = Local::now();
    let line = format!(
        "{}: {}\n",
        timestamp.format("%Y-%m-%d %H:%M:%S%.3f"),
        id
    );

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)?;

    file.write_all(line.as_bytes())?;
    file.flush()?;
    Ok(())
}

fn main() -> std::io::Result<()> {
    std::fs::create_dir_all("/usr/src/app/files")?;

    let id = Uuid::new_v4();
    let status_file = std::path::Path::new("/usr/src/app/files/logs.txt");
    // let status_file = std::path::Path::new("./files/logs.txt");

    loop {
        write_status_to_file(status_file, &id)?;
        std::thread::sleep(Duration::from_secs(5));
    }
}

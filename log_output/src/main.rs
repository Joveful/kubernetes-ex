use std::thread;
use std::time::Duration;

use chrono::Local;
use uuid::Uuid;

fn main() {
    let id = Uuid::new_v4();

    loop {
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        println!("{}: {}", timestamp, id.to_string());
        thread::sleep(Duration::from_secs(5));
    }
}

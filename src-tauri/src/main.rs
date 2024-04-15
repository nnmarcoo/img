// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[macro_use] extern crate lazy_static;
use std::sync::Mutex;
use std::env;
use std::fs::File;
use std::io::Read;
use base64::{engine::general_purpose, Engine as _};
use std::path::Path;

lazy_static! {
    static ref IMAGE_PATH: Mutex<String> = Mutex::new(String::new());
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    window.show().unwrap();
}

#[tauri::command]
fn set_image_path(path: String) {
    let mut image_path = IMAGE_PATH.lock().unwrap();
    *image_path = path;
}

#[tauri::command]
fn next_image() {
    //let mut image_path = IMAGE_PATH.lock().unwrap();
    let image_path_str: &str = &*IMAGE_PATH.lock().unwrap();

    // Create a Path from the string
    let path = Path::new(image_path_str);
    let parent_dir = path.parent();
    dbg!(parent_dir);




    //*image_path = String::from("");
}

#[tauri::command]
fn read_image(path: String) -> String {
    let mut file = File::open(path).unwrap();
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).unwrap();
    return general_purpose::STANDARD.encode(&buffer);
}

fn main() {
    let args: Vec<String> = env::args().collect();
    dbg!(args);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![show_window, set_image_path, read_image, next_image])
        .run(tauri::generate_context!())
        .expect("failed to run img");
}

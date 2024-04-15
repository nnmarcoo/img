// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[macro_use] extern crate lazy_static;
use std::sync::Mutex;
use std::env;
use std::fs::File;
use std::io::Read;
use base64::{engine::general_purpose, Engine as _};
use std::path::Path;
use std::fs;

lazy_static! {
    static ref IMAGE_PATH: Mutex<String> = Mutex::new(String::new());
    static ref IMAGE_TYPES: Vec<String> = vec![
        String::from("png"),
        String::from("jpeg"),
        String::from("jpg"),
        String::from("webp"),
    ];
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
fn next_image() -> String { // this is so bad lol
    let image_path_str: &str = &*IMAGE_PATH.lock().unwrap();
    let mut find_next = false;
    let path = Path::new(image_path_str);

    if let Some(parent_dir) = path.parent() {
        for entry in fs::read_dir(parent_dir).unwrap() {
            let entry = entry.unwrap();
            let entry_path = entry.path();
            if !entry_path.is_file() { continue; }

            let entry_ext = entry_path.extension();
            let entry_ext_str = entry_ext.unwrap().to_string_lossy().to_string();
            let entry_path_str = entry_path.to_string_lossy().to_string();
            if entry_path_str == image_path_str {
                find_next = true;
            }
            else if find_next == true {
                if IMAGE_TYPES.contains(&entry_ext_str) {
                    return entry_path_str;
                }
            }
        }
    }
    if let Some(parent_dir) = path.parent() {
        for entry in fs::read_dir(parent_dir).unwrap() {
            let entry = entry.unwrap();
            let entry_path = entry.path();
            if !entry_path.is_file() { continue; }

            let entry_ext = entry_path.extension();
            let entry_ext_str = entry_ext.unwrap().to_string_lossy().to_string();
            let entry_path_str = entry_path.to_string_lossy().to_string();
                if IMAGE_TYPES.contains(&entry_ext_str) {
                    return entry_path_str;
                }
            }
    }
    return String::from("");
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

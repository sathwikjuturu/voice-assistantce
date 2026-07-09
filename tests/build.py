import os
import shutil

def main():
    print("Packaging application for GitHub Pages...")
    dist_dir = 'dist'
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir)

    # Copy files
    for item in os.listdir('.'):
        if item.endswith('.html'):
            shutil.copy(item, dist_dir)
            print(f"Copied: {item}")
        elif item in ['css', 'js', 'PDFs'] and os.path.isdir(item):
            shutil.copytree(item, os.path.join(dist_dir, item))
            print(f"Copied directory: {item}")

    print("Build complete. Static bundle generated in 'dist/'")

if __name__ == '__main__':
    main()

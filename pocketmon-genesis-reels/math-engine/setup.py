from setuptools import setup, find_packages

setup(
    name='pocketmon-genesis-reels',
    version='0.1.0',
    author='Your Name',
    author_email='your.email@example.com',
    description='A slot game engine for PocketMon Genesis Reels',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=[
        'numpy==1.23.5',
        'scipy==1.10.1',
        'pandas==1.5.3',
        'matplotlib==3.7.1',
        'numba==0.57.1',
        'cython==0.29.36',
    ],
    classifiers=[
        'Programming Language :: Python :: 3.10',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.10',
)
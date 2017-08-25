# Always prefer setuptools over distutils
from setuptools import setup, find_packages
# To use a consistent encoding
from codecs import open
from os import path

# Get the long description from the README file
here = path.abspath(path.dirname(__file__))

setup(
    name='blitz_js_query',

    version='0.1.3',

    description='HTTP/Socket.io adapter for the blitz.js framework',
    long_description='Python package to connect to blitz.js API nodes. Please reference to GitHub for the full readme.',

    url='https://github.com/nexus-devs/pip-blitz-query',

    author='Nexus Devs',
    author_email='nexus@nexus-stats.com',

    license='MIT',

    classifiers=[
        'Development Status :: 3 - Alpha',

        'Intended Audience :: Developers',
        'Topic :: Internet :: WWW/HTTP',
        'License :: OSI Approved :: MIT License',

        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
    ],

    keywords='development blitz nexus socket.io http',

    packages=find_packages(),

    install_requires=['socketIO-client-nexus', 'promise', 'requests'],

    test_suite='nose.collector',
    tests_require=['nose']
)

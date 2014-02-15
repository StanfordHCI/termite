Termite
=======

Termite is a visualization tool for inspecting the output of statistical topic models based on the techniques described in the following publication:

[Termite: Visualization Techniques for Assessing Textual Topic Models](http://vis.stanford.edu/papers/termite)
Jason Chuang, Christopher D. Manning, Jeffrey Heer
Computer Science Dept, Stanford University
http://vis.stanford.edu/papers/termite

Current Development
===================

Starting in 2014, we have split the development into two components:
  * **[Termite Data Server](http://github.com/uwdata/termite-data-server)** for processing the output of topic models and providing the content as a web service
  * **[Termite Visualizations](http://github.com/uwdata/termite-visualizations)** for visualizing topic model outputs in a web browser

Our goals are to:
  * support multiple topic modeling tools
  * reduce the cost of developing new visualizations through shared infrastructure
  * provide a common interface so that multiple visualizations can interact with any number of topic modeling software, and with other visualizations

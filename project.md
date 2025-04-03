---
layout: default
title: HyunWoo's Project 
---

<div id="project">
  <h1>Projects</h1>
  <ul class="projects noList">
    {%- for project in site.projects -%}
      <li>
      	<span class="date">{{ project.date | date_to_string }}</span>
      	<h3><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h3>
      	<p class="description">{%- if project.description -%}{{ project.description  | strip_html | strip_newlines | truncate: 120 }}{%- else -%}{{ project.content | strip_html | strip_newlines | truncate: 120 }}{%- endif -%}</p>
      </li>
    {%- endfor -%}
  </ul>
</div>

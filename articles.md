---
layout: default
title: HyunWoo's Articles
permalink: /article/
---

<div id="article">
  <h1>Articles</h1>
  <ul class="posts noList">
    {%- for post in site.posts -%}
      <li>
      	<span class="date">{{ post.date | date_to_string }}</span>
      	<h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      	<p class="description">{%- if post.description -%}{{ post.description }}{%- else -%}{{
				post.excerpt | strip_html }}{%- endif -%}</p>
      </li>
    {%- endfor -%}
  </ul>
</div>
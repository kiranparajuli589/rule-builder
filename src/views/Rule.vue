<template>
  <div class="app">
    <nav class="app__bar">
      <h1>Rule Builder</h1>
    </nav>

    <section class="app__container">
      <aside class="app__nav">
        <h4>PLUGINS</h4>

        <ul>
          <li class="active">
            URL REWRITE

            <ul>
              <li class="active">PATH REWRITE</li>
              <li>QUERY REWRITE</li>
              <li>HEADERS REWRITE</li>
            </ul>
          </li>
          <li>BLACK RULES</li>
        </ul>
      </aside>

      <aside class="app__nav app__rule_nav">
        <h3>Path Rewrite</h3>

        <ul>
          <li>
            req.path.uri == "/api/v1/hello" && req.path.uri == "/api/v1/hello2"

            <button>Edit</button>
            <button>Delete</button>
          </li>
          <li>
            req.path.uri == "/hello" && req.geo.country == "US"
            <button>Edit</button>
            <button>Delete</button>
          </li>

          <li>
            req.path.uri == "/hello" && req.geo.country == "US" && req.headers["x-hello"] == "world"
            <button>Edit</button>
            <button>Delete</button>
          </li>
        </ul>

        <button class="btn-primary">Add Rule</button>
      </aside>

      <main class="app__content">
        <RuleBuilder />
      </main>
    </section>
  </div>
</template>
<script>
export default {
  name: "Rule",
  components: {
    RuleBuilder: () => import("@//components/builder-v2/RuleBuilder.vue"),
  }
}
</script>
<style lang="scss">
body {
  margin: 0;
  padding: 0;
  font-family: Inter, sans-serif;
}
.app {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;

  &__bar {
    width: 100%;
    height: 50px;
    background-color: rgba(248, 250, 255, 0.58);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    padding: 0 20px;
  }

  &__nav {
    width: 200px;
    display: flex;
    flex-direction: column;
    padding: 20px;
    height: calc(100vh - 50px);
    overflow-y: auto;
    border-right: 1px solid #e0e7ff;

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;

      li {
        padding: 10px;
        background-color: #e0e7ff;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;

        &:hover {
          background-color: #c7d2fe;
        }

        &.active {
          background-color: #6366f1;
          color: white;

          ul {
            margin-top: 10px;
            li {
              color: black;
            }
          }
        }

        ul {
          border-radius: 12px;
          border: 1px solid #99a7d8;
          padding: 10px;
          margin-top: 10px;
          background-color: #f0f4ff;
          li {
            background-color: #f7f9ff;

            &.active {
              color: white !important;
            }
          }
        }
      }
    }

    position: relative;
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(5px);
      z-index: 1;
    }
  }

  &__rule_nav {
    width: 350px;


  }

  &__container {
    display: flex;
    flex-grow: 1;
    height: calc(100dvh - 50px);
    overflow: hidden;
  }

  &__content {
    padding: 20px;
    background-color: #f0f0f0;
    flex-grow: 1;
    overflow-y: auto;
  }
}
</style>
